package com.mirusystems.be.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MetaData {
    public long MMSI;
    public String ShipName;
    public double latitude;
    public double longitude;
    public String time_utc;
}