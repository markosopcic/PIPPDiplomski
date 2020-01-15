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
import android.os.Binder;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.room.Room;

import com.example.projekt.networking.PositionSender;
import com.example.projekt.storage.Position;
import com.example.projekt.storage.PositionDatabase;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import io.reactivex.Observable;
import io.reactivex.disposables.Disposable;

public class LocationService extends Service {
    public static final String CHANNEL_ID = "ForegroundServiceChannel";
    public int interval = Constants.DEFAULT_INTERVAL_MILLIS;
    private final IBinder mBinder = new LocationBinder();
    List<ILocationListener> locationListeners = new ArrayList<>();


    LocationManager locationManager;
    Location loc;
    LocationListener listener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            if(loc != null) {
                double p = 0.017453292519943295;    // Math.PI / 180
                double a = 0.5 - Math.cos((location.getLatitude() - loc.getLatitude()) * p) / 2 +
                        Math.cos(loc.getLatitude() * p) * Math.cos(location.getLatitude() * p) *
                                (1 - Math.cos((location.getLongitude() - loc.getLongitude()) * p)) / 2;
                double d = 12742 * Math.asin(Math.sqrt(a))*1000;
                Log.d("Position_debug",String.format("%.2f %f",d,location.getAccuracy()));
            }
            if (loc == null || location.getTime() - loc.getTime() > interval || (location.getAccuracy() < loc.getAccuracy()))
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
        return mBinder;
    }

    Disposable task;

    @Override
    public void onDestroy() {
        if(task != null) {
            task.dispose();
        }
        locationManager.removeUpdates(listener);
        locationListeners.clear();
        stopForeground(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent.getAction().equals("stop")) {
            onDestroy();
            return super.onStartCommand(intent, flags, startId);
        }
        locationManager = (LocationManager)
                getSystemService(Context.LOCATION_SERVICE);

        String input = intent.getStringExtra("inputExtra");
        interval = intent.getIntExtra("interval", Constants.DEFAULT_INTERVAL_MILLIS);
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
            return super.onStartCommand(intent, flags, startId);
        }
        startForeground(1, notification);


        task = Observable.interval(interval, TimeUnit.MILLISECONDS).subscribe((e) -> {
            for(ILocationListener listener : locationListeners){
                listener.nextLocation(loc);
            }
                }
        );
        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, interval, 0, (LocationListener) listener);
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, interval, 0, listener);

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

    public class LocationBinder extends Binder {
        LocationService getService(){
            return LocationService.this;
        }
    }
}
