package com.example.projekt;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import io.reactivex.Observable;
import io.reactivex.disposables.Disposable;
import io.reactivex.functions.Consumer;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.SyncStateContract;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import java.util.concurrent.TimeUnit;

public class MainActivity extends AppCompatActivity {

    static String defaultHost = "http://msopcic.hopto.org";
    Button send;
    TextView name, host;
    Disposable task;
    boolean sending = false;
    Location loc;
    OkHttpClient client;
    LocationManager locationManager;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        send = findViewById(R.id.button);
        name = findViewById(R.id.name);
        host = findViewById(R.id.host);
        client = new OkHttpClient.Builder().addInterceptor(new LoggingInterceptor()).build();
        locationManager = (LocationManager)
                getSystemService(Context.LOCATION_SERVICE);

        send.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(!sending) {
                    if (    checkSelfPermission(Manifest.permission.FOREGROUND_SERVICE) != PackageManager.PERMISSION_GRANTED
                            ||
                            checkSelfPermission(Manifest.permission.INTERNET) != PackageManager.PERMISSION_GRANTED ||
                            checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.INTERNET,Manifest.permission.FOREGROUND_SERVICE},
                                99);
                        return;
                    }
                    Intent intent = new Intent(MainActivity.this, LocationService.class);
                    intent.putExtra("name", name.getText().toString());
                    intent.putExtra("host", host.getText().toString());
                    intent.setAction("start");
                    startForegroundService(intent);
                    sending = true;
                }else{
                    sending = false;
                    Intent stopIntent = new Intent(MainActivity.this, LocationService.class);
                    stopIntent.setAction("stop");
                    startService(stopIntent);
                }
            }
        });
        /*send.setOnClickListener(new View.OnClickListener() {
            @RequiresApi(api = Build.VERSION_CODES.M)
            @Override
            public void onClick(View v) {
                if (!sending) {
                    if (    checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION) != PackageManager.PERMISSION_GRANTED
                         ||
                            checkSelfPermission(Manifest.permission.INTERNET) != PackageManager.PERMISSION_GRANTED ||
                            checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.INTERNET,Manifest.permission.ACCESS_BACKGROUND_LOCATION},
                                99);
                        return;
                    }
                    Toast.makeText(MainActivity.this,(CharSequence)"Sending!",Toast.LENGTH_LONG).show();
                    sending = true;
                    locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 2000, 0, (LocationListener) listener);
                    locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000, 0, listener);
                    task = Observable.interval(2000, TimeUnit.MILLISECONDS).subscribe(new Consumer<Long>() {
                        @Override
                        public void accept(Long aLong) throws Exception {
                            try {
                                if(loc == null) return;
                                String h=defaultHost;
                                if(host.getText().toString().trim().length()!=0){
                                    h=host.getText().toString();
                                }
                                String data = "{\"Name\":\"" + name.getText().toString() + "\",\"longitude\":" + loc.getLongitude() + ",\"latitude\":" + loc.getLatitude() + "}";
                                Response r = client.newCall(new Request.Builder().post(RequestBody.create(data, MediaType.parse("application/json"))).url(h+"/Position").build()).execute();
                                Log.d("response",Integer.toString(r.code()));
                            }catch(Exception e){
                                System.out.println(e);
                            }
                        }
                    });
                }else{
                    Toast.makeText(MainActivity.this,(CharSequence)"Not Sending!",Toast.LENGTH_LONG).show();
                    locationManager.removeUpdates(listener);
                    task.dispose();
                    sending = false;
                }
            }
        });*/
    }
}
