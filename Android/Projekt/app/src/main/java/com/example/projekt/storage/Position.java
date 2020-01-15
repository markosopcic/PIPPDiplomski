package com.example.projekt.storage;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity
public class Position {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "name")
    public String name;

    @ColumnInfo(name = "longitude")
    public double longitude;

    @ColumnInfo(name = "latitude")
    public double latitude;

    @ColumnInfo(name = "time")
    public long timestamp;


    public Position(double longitude, double latitude, long timestamp, String name) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.timestamp = timestamp;
        this.name = name;
    }

}
