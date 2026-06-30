package com.mirusystems.be.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mirusystems.be.config.AisStreamConfig.AisStreamProperties;
import com.mirusystems.be.dto.AisMessage;
import com.mirusystems.be.dto.VesselState;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Service
@Slf4j
public class AisStreamService {

    private final AisStreamProperties props;
    private final ObjectMapper mapper = new ObjectMapper();

    // MMSI(문자열) -> 최신 상태
    private final Map<String, VesselState> vesselCache = new ConcurrentHashMap<>();
    // 현재 추적 중인 MMSI 목록
    private final Set<String> trackedMmsi = ConcurrentHashMap.newKeySet();

    private WebSocketClient client;
    private Consumer<VesselState> onUpdateCallback;

    public AisStreamService(AisStreamProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void connect() {
        log.info("🔎 API KEY Length : {}", props.apiKey() != null ? props.apiKey().length() : "NULL");
        try {
            client = new WebSocketClient(new URI(props.wsUrl())) {

                @Override
                public void onOpen(ServerHandshake handshakedata) {
                    log.info("✅ AIS WebSocket 연결 성공");
                    sendSubscription();
                }

                @Override
                public void onMessage(ByteBuffer message) {
                    handleMessage(StandardCharsets.UTF_8.decode(message).toString());
                }

                @Override
                public void onMessage(String message) {
                    handleMessage(message);
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

    public void trackVessel(String mmsi) {
        boolean added = trackedMmsi.add(mmsi);
        if (added) {
            sendSubscription();
        }
    }

    public void untrackVessel(String mmsi) {
        trackedMmsi.remove(mmsi);
        vesselCache.remove(mmsi);
        sendSubscription();
    }

    public VesselState getStateByMmsi(String mmsi) {
        return vesselCache.get(mmsi);
    }

    public void setOnUpdateCallback(Consumer<VesselState> callback) {
        this.onUpdateCallback = callback;
    }

    private void sendSubscription() {
        if (client == null || !client.isOpen() || trackedMmsi.isEmpty()) return;
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("APIKey", props.apiKey());
            req.put("BoundingBoxes", List.of(List.of(List.of(-90.0, -180.0), List.of(90.0, 180.0))));
            req.put("FiltersShipMMSI", new ArrayList<>(trackedMmsi));
            client.send(mapper.writeValueAsString(req));
            log.info("구독 갱신: {}", trackedMmsi);
        } catch (Exception e) {
            log.error("구독 전송 실패", e);
        }
    }

    private void handleMessage(String json) {
        try {
            AisMessage ais = mapper.readValue(json, AisMessage.class);
            if (ais.MetaData == null) return;

            String mmsiKey = String.valueOf(ais.MetaData.MMSI);

            if (!trackedMmsi.contains(mmsiKey)) return;

            VesselState state = vesselCache.computeIfAbsent(mmsiKey, k -> new VesselState());
            state.setMmsi(ais.MetaData.MMSI);
            state.setShipName(ais.MetaData.ShipName);
            state.setLatitude(ais.MetaData.latitude);
            state.setLongitude(ais.MetaData.longitude);
            state.setLastUpdated(ais.MetaData.time_utc);

            if ("PositionReport".equals(ais.MessageType) && ais.Message.PositionReport != null) {
                state.setSog(ais.Message.PositionReport.Sog);
                state.setCog(ais.Message.PositionReport.Cog);
            }
            if ("ShipStaticData".equals(ais.MessageType) && ais.Message.ShipStaticData != null) {
                state.setDestination(ais.Message.ShipStaticData.Destination);
                state.setEta(String.valueOf(ais.Message.ShipStaticData.Eta));
            }

            if (onUpdateCallback != null) {
                onUpdateCallback.accept(state);
            }
        } catch (Exception e) {
            // 다른 메시지 타입이거나 파싱 실패 시 무시
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