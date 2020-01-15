package com.example.projekt.networking;

import com.example.projekt.Constants;
import com.example.projekt.LoggingInterceptor;
import com.example.projekt.storage.Position;
import com.example.projekt.storage.PositionDatabase;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class PositionSender {
    private String host = null;
    private PositionDatabase database;
    private Position lastPosition = null;
    final static OkHttpClient client = new OkHttpClient.Builder().addInterceptor(new LoggingInterceptor()).build();

    public PositionSender(PositionDatabase database) {
        this.database = database;
    }

    public void sendPosition(Position p, String name, boolean isOffline) {
        if(didntMove(p)){
            return;
        }

        if (isOffline) {
            database.positionDao().addPosition(p);
            lastPosition = p;
            return;
        }

        lastPosition = p;
        LocalDateTime ldt = LocalDateTime.ofInstant(Instant.ofEpochMilli(p.timestamp), ZoneId.systemDefault());
        String data = "{\"Name\":\"" + name + "\",\"longitude\":" + p.longitude + ",\"latitude\":" + p.latitude + ",\"time\":\"" + ldt.format(DateTimeFormatter.ISO_DATE_TIME) + "Z\"}";
        String currHost = host == null ? Constants.DEFAULT_HOST : host;
        try {
            Response r = client.newCall(new Request.Builder().post(RequestBody.create(data, MediaType.parse("application/json"))).url(currHost + "/Position").build()).execute();
            if (r.code() != 200) {
                database.positionDao().addPosition(p);
            }
        } catch (Exception e) {
            database.positionDao().addPosition(p);
        }
    }

    private boolean didntMove(Position pos){
        if(lastPosition == null) return false;
        double p = 0.017453292519943295;    // Math.PI / 180
        double a = 0.5 - Math.cos((pos.latitude - lastPosition.latitude) * p)/2 +
                Math.cos(lastPosition.latitude * p) * Math.cos(pos.latitude * p) *
                        (1 - Math.cos((pos.longitude - lastPosition.longitude) * p))/2;
        double d = 12742 * Math.asin(Math.sqrt(a));
        if(d*1000 < 1){
            return true;
        }
        return false;
    }

    public String getHost() {
        if (host == null) return Constants.DEFAULT_HOST;
        return host;
    }

    public void setHost(String host) {
        if (host.trim().length() == 0) {
            host = null;
            return;
        }
        if (!host.startsWith("http://")) host = "http://" + host;
        this.host = host;
    }

    public int sendAllHistoricPositions() {
        int count = 0;
        while (true) {
            List<Position> positions = database.positionDao().getPositions(100);
            if (positions.size() == 0) {
                return count;
            }
            StringBuilder data = new StringBuilder("{\"Name\":\"" + positions.get(0).name + "\",\"positions\":[");
            for (Position p : positions) {
                LocalDateTime ldt = LocalDateTime.ofInstant(Instant.ofEpochMilli(p.timestamp), ZoneId.systemDefault());
                data.append("{\"longitude\":" + p.longitude + ",\"latitude\":" + p.latitude + ",\"time\":\"" + ldt.format(DateTimeFormatter.ISO_DATE_TIME) + "Z" + "\"},");
            }

            data.deleteCharAt(data.length() - 1);
            data.append("]}");
            try {
                Response r = client.newCall(new Request.Builder().post(RequestBody.create(data.toString(), MediaType.parse("application/json"))).url(getHost() + Constants.HISTORICAL_POSITIONS_ENDPOINT).build()).execute();
                if (r.code() == 200) {
                    database.positionDao().delete(positions);
                    count+=positions.size();
                }
            } catch (Exception e) {
                return count;
            }
        }
    }
}
