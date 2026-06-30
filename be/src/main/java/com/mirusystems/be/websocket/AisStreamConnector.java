package com.mirusystems.be.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mirusystems.be.config.AisStreamConfig.AisStreamProperties;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Consumer;

@Component
@Slf4j
public class AisStreamConnector {

    private final AisStreamProperties props;
    private final ObjectMapper mapper = new ObjectMapper();

    private WebSocketClient client;
    private Consumer<String> messageHandler;

    public AisStreamConnector(AisStreamProperties props) {
        this.props = props;
    }

    public void setMessageHandler(Consumer<String> handler) {
        this.messageHandler = handler;
    }

    @PostConstruct
    public void connect() {
        log.info("🔎 API KEY Length : {}", props.apiKey() != null ? props.apiKey().length() : "NULL");
        try {
            client = new WebSocketClient(new URI(props.wsUrl())) {

                @Override
                public void onOpen(ServerHandshake handshakedata) {
                    log.info("✅ AIS WebSocket 연결 성공");
                }

                @Override
                public void onMessage(ByteBuffer message) {
                    dispatch(StandardCharsets.UTF_8.decode(message).toString());
                }

                @Override
                public void onMessage(String message) {
                    dispatch(message);
                }

                @Override
                public void onClose(int code, String reason, boolean remote) {
                    log.warn("연결 종료: {} → 재연결 시도", reason);
                    reconnectWithDelay();
                }

                @Override
                public void onError(Exception ex) {
                    log.error("소켓 에러", ex);
                }
            };
            client.connect();
        } catch (URISyntaxException e) {
            log.error("URI 오류", e);
        }
    }

    public void subscribe(Collection<String> mmsiList, List<List<List<Double>>> boundingBoxes) {
        if (client == null || !client.isOpen()) return;
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("APIKey", props.apiKey());
            req.put("BoundingBoxes", boundingBoxes);
            if (mmsiList != null && !mmsiList.isEmpty()) {
                req.put("FiltersShipMMSI", new ArrayList<>(mmsiList));
            }
            String payload = mapper.writeValueAsString(req);
            log.info("📤 구독 요청 전송: {}", payload);
            client.send(payload);
        } catch (Exception e) {
            log.error("구독 전송 실패", e);
        }
    }

    // 기존 MMSI 전용 호출부와 호환되도록 오버로드 유지
    public void subscribe(Collection<String> mmsiList) {
        subscribe(mmsiList, List.of(List.of(List.of(-90.0, -180.0), List.of(90.0, 180.0))));
    }

    private void dispatch(String json) {
        if (messageHandler != null) {
            messageHandler.accept(json);
        }
    }

    private void reconnectWithDelay() {
        new Thread(() -> {
            try {
                Thread.sleep(3000);
                connect();
            } catch (InterruptedException ignored) {}
        }).start();
    }

    @PreDestroy
    public void disconnect() {
        if (client != null) client.close();
    }
}
