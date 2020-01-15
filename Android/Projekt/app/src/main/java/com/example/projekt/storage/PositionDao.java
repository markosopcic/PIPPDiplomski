package com.example.projekt.storage;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

@Dao
public interface PositionDao {

    @Query("SELECT * from position")
    List<Position> getPositions();

    @Query("SELECT * from position where name like (select name from position limit 1) limit :x")
    List<Position> getPositions(int x);

    @Insert
    void addPosition(Position position);

    @Delete
    void delete(List<Position> positions);
}
