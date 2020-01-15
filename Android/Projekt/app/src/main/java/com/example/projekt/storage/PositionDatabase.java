package com.example.projekt.storage;

import androidx.room.Database;
import androidx.room.RoomDatabase;


@Database(entities = {Position.class}, version = 2)
public abstract class PositionDatabase extends RoomDatabase {

    public abstract PositionDao positionDao();
}
