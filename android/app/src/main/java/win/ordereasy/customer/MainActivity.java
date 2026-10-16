package win.ordereasy.customer;

import android.os.Bundle;
import com.facebook.appevents.AppEventsLogger;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            AppEventsLogger.activateApp(getApplication());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
