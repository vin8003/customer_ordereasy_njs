package win.ordereasy.customer;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null) {
                    WebView webView = (WebView) bridge.getWebView();
                    if (webView != null && webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }
                }
                finish();
            }
        });
    }
}