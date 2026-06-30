package com.mirusystems.be.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mirusystems.be.dto.AisMessage;
import com.mirusystems.be.dto.VesselState;
import com.mirusystems.be.websocket.AisStreamConnector;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Service
@Slf4j
public class VesselTrackingService {

    private final AisStreamConnector connector;
    private final ObjectMapper mapper = new ObjectMapper();

    private final Map<String, VesselState> vesselCache = new ConcurrentHashMap<>();
    private final Set<String> trackedMmsi = ConcurrentHashMap.newKeySet();

    private Consumer<VesselState> onUpdateCallback;
    private volatile boolean areaTracking = false;

    public VesselTrackingService(AisStreamConnector connector) {
        this.connector = connector;
    }

    @PostConstruct
    public void init() {
        connector.setMessageHandler(this::handleMessage);
    }

    public List<String> findTrackingMmsiIds() {
        return trackedMmsi.stream().toList();
    }

    public void trackVessel(String mmsi) {
        boolean added = trackedMmsi.add(mmsi);
        if (added) {
            connector.subscribe(trackedMmsi);
        }
    }

    public void trackArea(double minLat, double minLon, double maxLat, double maxLon) {
        areaTracking = true;
        List<List<List<Double>>> bbox = List.of(
                List.of(List.of(minLat, minLon), List.of(maxLat, maxLon))
        );
        connector.subscribe(Collections.emptyList(), bbox);
    }

    public void untrackVessel(String mmsi) {
        trackedMmsi.remove(mmsi);
        vesselCache.remove(mmsi);
        connector.subscribe(trackedMmsi);
    }

    public void untrackAllVessel() {
        areaTracking = false;
        trackedMmsi.clear();
        vesselCache.clear();
    }

    public VesselState getRecentStateByMmsi(String mmsi) {
        return vesselCache.get(mmsi);
    }

    public void setOnUpdateCallback(Consumer<VesselState> callback) {
        this.onUpdateCallback = callback;
    }

    private void handleMessage(String json) {
        log.debug("📨 RAW 수신: {}", json);
        try {
            AisMessage ais = mapper.readValue(json, AisMessage.class);
            if (ais.MetaData == null) return;

            String mmsiKey = String.valueOf(ais.MetaData.MMSI);
            if (areaTracking) {
                trackedMmsi.add(mmsiKey);
            } else if (!trackedMmsi.contains(mmsiKey)) {
                return;
            }

            VesselState state = vesselCache.computeIfAbsent(mmsiKey, k -> new VesselState());
            state.setMmsi(ais.MetaData.MMSI);
            state.setShipName(ais.MetaData.ShipName);
            state.setLatitude(ais.MetaData.latitude);
            state.setLongitude(ais.MetaData.longitude);
            state.setLastUpdated(ais.MetaData.time_utc);

            if ("PositionReport".equals(ais.MessageType) && ais.Message != null && ais.Message.PositionReport != null) {
                state.setSog(ais.Message.PositionReport.Sog);
                state.setCog(ais.Message.PositionReport.Cog);
                log.info("📍 위치 업데이트 [{}] {}: lat={}, lon={}, sog={}",
                        mmsiKey, state.getShipName(), state.getLatitude(), state.getLongitude(), state.getSog());
            }
            if ("ShipStaticData".equals(ais.MessageType) && ais.Message != null && ais.Message.ShipStaticData != null) {
                state.setDestination(ais.Message.ShipStaticData.Destination);
                state.setEta(String.valueOf(ais.Message.ShipStaticData.Eta));
            }

            if (onUpdateCallback != null) {
                onUpdateCallback.accept(state);
            }
        } catch (Exception e) {
            log.warn("📛 메시지 파싱 실패: {}", e.getMessage());
        }
    }
}
