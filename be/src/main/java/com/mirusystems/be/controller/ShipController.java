package com.mirusystems.be.controller;

import com.mirusystems.be.dto.VesselState;
import com.mirusystems.be.service.AisStreamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/ship")
public class ShipController {

    private final AisStreamService aisStreamService;

    public ShipController(AisStreamService aisStreamService) {
        this.aisStreamService = aisStreamService;
    }

    @GetMapping("/{mmsi}")
    public ResponseEntity<VesselState> getShip(@PathVariable String mmsi) {
        aisStreamService.trackVessel(mmsi);
        VesselState state = aisStreamService.getStateByMmsi(mmsi);
        if (state == null) {
            return ResponseEntity.status(202).build(); // 아직 신호 수신 전
        }
        return ResponseEntity.ok(state);
    }
}