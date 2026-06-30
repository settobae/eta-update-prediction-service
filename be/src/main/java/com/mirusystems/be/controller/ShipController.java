package com.mirusystems.be.controller;

import com.mirusystems.be.dto.VesselState;
import com.mirusystems.be.service.VesselTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/v1/ship")
public class ShipController {

    private final VesselTrackingService vesselTrackingService;

    public ShipController(VesselTrackingService vesselTrackingService) {
        this.vesselTrackingService = vesselTrackingService;
    }

    // 구독 MMIS 목록 조회
    @GetMapping("/tracks")
    public ResponseEntity<List<String>> findTrackingMmsiIds() {
        return ResponseEntity.of(Optional.ofNullable(vesselTrackingService.findTrackingMmsiIds()));
    }

    // 범위 내 구독
    @PostMapping("/area")
    public ResponseEntity<Void> trackArea(
            @RequestParam double minLat,
            @RequestParam double minLon,
            @RequestParam double maxLat,
            @RequestParam double maxLon) {
        vesselTrackingService.trackArea(minLat, minLon, maxLat, maxLon);
        return ResponseEntity.accepted().build();
    }

    // 전체 구독 취소
    @DeleteMapping
    public ResponseEntity<Void> untrackAll() {
        vesselTrackingService.untrackAllVessel();
        return ResponseEntity.noContent().build();
    }

    // 특정 MMSI 구독 등록
    @PostMapping("/subscribe/{mmsi}")
    public ResponseEntity<Void> subscribeShip(@PathVariable String mmsi) {
        vesselTrackingService.trackVessel(mmsi);
        return ResponseEntity.accepted().build();
    }

    // 현재 상태 조회
    @GetMapping("/{mmsi}")
    public ResponseEntity<VesselState> getShip(@PathVariable String mmsi) {
        VesselState state = vesselTrackingService.getRecentStateByMmsi(mmsi);
        if (state == null) {
            return ResponseEntity.status(202).build();
        }
        return ResponseEntity.ok(state);
    }

    // 특정 MMSI 구독 취소
    @DeleteMapping("/{mmsi}")
    public ResponseEntity<Void> untrackShip(@PathVariable String mmsi) {
        vesselTrackingService.untrackVessel(mmsi);
        return ResponseEntity.noContent().build();
    }
}