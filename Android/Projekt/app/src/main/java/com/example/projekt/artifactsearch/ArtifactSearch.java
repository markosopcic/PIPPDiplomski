package com.example.projekt.artifactsearch;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatActivity;

import java.util.concurrent.TimeUnit;

import io.reactivex.Observable;
import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.disposables.Disposable;
import io.reactivex.schedulers.Schedulers;

public class ArtifactSearch extends AppCompatActivity {

    private boolean nameNotSet = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String name = getIntent().getStringExtra("name");
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.loadUrl("http://msopcic.hopto.org/Mobile");
        Observable.interval(500, TimeUnit.MILLISECONDS).observeOn(AndroidSchedulers.mainThread()).takeWhile(e -> nameNotSet)
                .subscribe(e -> webView.evaluateJavascript("setTrackedUser('"+name+"');", g -> {
                    if (g.equals("true")) {
                            nameNotSet = true;
                    }}));
        setContentView(webView);
    }
}