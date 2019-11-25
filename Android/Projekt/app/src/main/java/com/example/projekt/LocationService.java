package com.example.projekt;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;

import java.util.concurrent.TimeUnit;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import io.reactivex.Observable;
import io.reactivex.disposables.Disposable;
import io.reactivex.functions.Consumer;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import static com.example.projekt.MainActivity.defaultHost;

public class LocationService extends Service {
    public static final String CHANNEL_ID = "ForegroundServiceChannel";
    LocationManager locationManager;
    Location loc;
    LocationListener listener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            if(loc == null || location.getTime() - loc.getTime() > 2000 || (location.getAccuracy() > loc.getAccuracy()))
                loc = location;
        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {

        }

        @Override
        public void onProviderEnabled(String provider) {

        }

        @Override
        public void onProviderDisabled(String provider) {

        }
    };
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    Disposable task;

    @Override
    public void onDestroy() {
        task.dispose();
        locationManager.removeUpdates(listener);
        stopForeground(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if(intent.getAction().equals("stop")){
            onDestroy();
            return super.onStartCommand(intent,flags,startId);
        }
        locationManager = (LocationManager)
                getSystemService(Context.LOCATION_SERVICE);
        String input = intent.getStringExtra("inputExtra");
        final String name = intent.getStringExtra("name");
        final String host = intent.getStringExtra("host");
        createNotificationChannel();
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this,
                0, notificationIntent, 0);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Position Tracker")
                .setContentText(input)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentIntent(pendingIntent)
                .build();
        if (
                checkSelfPermission(Manifest.permission.INTERNET) != PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return super.onStartCommand(intent,flags,startId);
        }
        final OkHttpClient  client = new OkHttpClient.Builder().addInterceptor(new LoggingInterceptor()).build();
        startForeground(1, notification);
        task = Observable.interval(5000, TimeUnit.MILLISECONDS).subscribe(new Consumer<Long>() {
            @Override
            public void accept(Long aLong){
                try {
                    if(loc == null) return;
                    String h=defaultHost;
                    if(host.trim().length()!=0){
                        h=host;
                    }
                    String data = "{\"Name\":\"" + name + "\",\"longitude\":" + loc.getLongitude() + ",\"latitude\":" + loc.getLatitude() + "}";
                    Response r = client.newCall(new Request.Builder().post(RequestBody.create(data, MediaType.parse("application/json"))).url(h+"/Position").build()).execute();
                    Log.d("response",Integer.toString(r.code()));
                }catch(Exception e){
                    System.out.println(e);
                }
            }
        });
        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 2000, 0, (LocationListener) listener);
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000, 0, listener);

        return super.onStartCommand(intent, flags, startId);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
            );

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
}
