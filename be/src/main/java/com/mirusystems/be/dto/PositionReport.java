package com.mirusystems.be.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PositionReport {
    public double Latitude;
    public double Longitude;
    public double Sog;
    public double Cog;
    public double TrueHeading;
    public int NavigationalStatus;
}