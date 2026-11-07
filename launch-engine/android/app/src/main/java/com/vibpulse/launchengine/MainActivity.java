package com.vibpulse.launchengine;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Offline shell: shows the bundled Launch Engine page and bridges file save/open to Android's pickers. */
public class MainActivity extends Activity {
    private static final String APP_URL = "file:///android_asset/launch-engine.html";
    private static final int REQ_SAVE = 1;
    private static final int REQ_OPEN = 2;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // localStorage holds all project data
        s.setAllowFileAccess(true);   // needed for file:///android_asset
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setAllowContentAccess(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme()) && uri.getPath() != null && uri.getPath().startsWith("/android_asset/")) {
                    return false; // stay in the app
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri)); // e.g. "Open site" -> real browser
                } catch (ActivityNotFoundException ignored) {
                    toast("No app can open this link");
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                // */* because many providers label .json as octet-stream and grey it out.
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try {
                    startActivityForResult(pick, REQ_OPEN);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
            }
        });

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        if (state != null) web.restoreState(state);
        else web.loadUrl(APP_URL);
    }

    /** Only capability exposed to the page: hand text to the system "Save as" picker. */
    private class Bridge {
        @JavascriptInterface
        public void saveFile(String name, String text, String type) {
            try (OutputStream out = new FileOutputStream(pendingFile())) {
                out.write(text.getBytes(StandardCharsets.UTF_8)); // survives process death while the picker is open
            } catch (Exception e) {
                runOnUiThread(() -> toast("Could not prepare file: " + e.getMessage()));
                return;
            }
            runOnUiThread(() -> {
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                        .addCategory(Intent.CATEGORY_OPENABLE)
                        .setType(type == null || type.isEmpty() ? "application/octet-stream" : type)
                        .putExtra(Intent.EXTRA_TITLE, name);
                try {
                    startActivityForResult(save, REQ_SAVE);
                } catch (ActivityNotFoundException e) {
                    toast("No file manager available to save");
                }
            });
        }
    }

    private File pendingFile() {
        return new File(getCacheDir(), "pending-save");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Uri uri = (resultCode == RESULT_OK && data != null) ? data.getData() : null;
        if (requestCode == REQ_OPEN) {
            if (fileCallback != null) fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri}); // null on cancel unblocks the input
            fileCallback = null;
        } else if (requestCode == REQ_SAVE) {
            File pending = pendingFile();
            if (uri != null) {
                try (InputStream in = new FileInputStream(pending); OutputStream out = getContentResolver().openOutputStream(uri)) {
                    byte[] buf = new byte[8192];
                    for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
                    toast("Saved");
                } catch (Exception e) {
                    toast("Save failed: " + e.getMessage());
                }
            }
            //noinspection ResultOfMethodCallIgnored
            pending.delete();
        }
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); // hash routes are history entries
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }
}
