package com.mirusystems.be.dto;

import lombok.Data;

@Data
public class VesselState {
    private long mmsi;
    private String shipName;
    private double latitude;
    private double longitude;
    private double sog; // speed
    private double cog; // direction
    private String destination;
    private String eta;
    private String lastUpdated;
}