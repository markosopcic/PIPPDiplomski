package com.example.projekt;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;
import android.widget.Button;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.room.Room;

import com.example.projekt.networking.PositionSender;
import com.example.projekt.storage.Position;
import com.example.projekt.storage.PositionDatabase;

import okhttp3.OkHttpClient;

public class MainActivity extends AppCompatActivity implements ILocationListener {
    public PositionDatabase positionDatabase;
    public PositionSender sender;
    Button trackingToggle, upload;
    TextView name, host, interval,longitude,latitude;
    public Switch offlineTracking;
    boolean sending = false;
    OkHttpClient client;
    LocationManager locationManager;
    LocationService locationService;
    private ServiceConnection connection = new ServiceConnection(){
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            locationService= ((LocationService.LocationBinder) service).getService();
            locationService.locationListeners.add(MainActivity.this);
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            locationService.locationListeners.remove(MainActivity.this);
            locationService = null;
        }
    };


    @Override
    protected void onDestroy() {
        super.onDestroy();
        sending = false;
        Intent stopIntent = new Intent(MainActivity.this, LocationService.class);
        stopIntent.setAction("stop");
        startService(stopIntent);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        trackingToggle = findViewById(R.id.button);
        upload = findViewById(R.id.offlineUpload);
        name = findViewById(R.id.name);
        host = findViewById(R.id.host);
        interval = findViewById(R.id.interval);
        longitude = findViewById(R.id.longitude);
        latitude = findViewById(R.id.latitude);
        client = new OkHttpClient.Builder().addInterceptor(new LoggingInterceptor()).build();
        offlineTracking = findViewById(R.id.offlinetrackingswitch);
        checkPermissions();
        locationManager = (LocationManager)
                getSystemService(Context.LOCATION_SERVICE);
        positionDatabase = Room.databaseBuilder(getApplicationContext(), PositionDatabase.class, Constants.DATABASE_NAME).build();
        sender = new PositionSender(positionDatabase);
        trackingToggle.setOnClickListener(v -> {
            if (!checkPermissions()) {
                return;
            }
            if (!sending) {
                Intent intent = new Intent(MainActivity.this, LocationService.class);
                Integer duration = Constants.DEFAULT_INTERVAL_MILLIS;
                if (interval.getText().toString().length() != 0) {
                    duration = Integer.parseInt(interval.getText().toString()) * 1000;
                }
                intent.putExtra("interval", duration);
                intent.setAction("start");
                startForegroundService(intent);
                bindService(intent,connection,Context.BIND_AUTO_CREATE);
                sending = true;
                trackingToggle.setText(Constants.TRACKING_STOP_TEXT);
                offlineTracking.setEnabled(false);
                host.setEnabled(false);
                name.setEnabled(false);
                interval.setEnabled(false);
            } else {
                sending = false;
                trackingToggle.setText(Constants.TRACKING_START_TEXT);
                offlineTracking.setEnabled(true);
                host.setEnabled(true);
                name.setEnabled(true);
                interval.setEnabled(true);
                Intent stopIntent = new Intent(MainActivity.this, LocationService.class);
                stopIntent.setAction("stop");
                startService(stopIntent);
                unbindService(connection);
            }
        });

        upload.setOnClickListener((v) -> {
            sender.setHost(host.getText().toString());
            new Thread(){
                @Override
                public void run() {
                    super.run();
                    int res = sender.sendAllHistoricPositions();
                    Looper.prepare();
                    runOnUiThread(() ->Toast.makeText(MainActivity.this, "Sent " + res + " positions.", Toast.LENGTH_LONG).show());
                }
            }.start();
        });

    }


    private boolean checkPermissions() {
        if (checkSelfPermission(Manifest.permission.FOREGROUND_SERVICE) != PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.INTERNET) != PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(MainActivity.this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.INTERNET, Manifest.permission.FOREGROUND_SERVICE},
                    99);
            return false;
        }
        return true;
    }

    @Override
    public void nextLocation(Location location) {
        if (location == null) return;
        runOnUiThread(() ->{
        longitude.setText(String.format("%.10f",location.getLongitude()));
        latitude.setText(String.format("%.10f",location.getLatitude()));
        });

        Position position = new Position(location.getLongitude(), location.getLatitude(), System.currentTimeMillis(), name.getText().toString());
        sender.setHost(host.getText().toString());
        sender.sendPosition(position, name.getText().toString(), offlineTracking.isChecked());
    }
}
