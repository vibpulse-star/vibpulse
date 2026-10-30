package com.vibpulse.launcher.warroom;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/** Opens the app's URL in the browser and gets out of the way. */
public class OpenActivity extends Activity {
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.launch_url))));
        finish();
    }
}
