package local.documenttreeaccess.plugin;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.*;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "DocumentTreeAccess")
public class DocumentTreeAccessPlugin extends Plugin {

    private static final int REQUEST_FOLDER = 4001;

    private DocumentFile getRootFolder() {
        try {
            Context context = getContext();
            if (context == null) {
                return null;
            }

            SharedPreferences prefs = context.getSharedPreferences("docTreeAccess", Context.MODE_PRIVATE);
            String uriStr = prefs.getString("folder_uri", null);
            if (uriStr == null) {
                return null;
            }

            Uri uri = Uri.parse(uriStr);
            if (uri == null) {
                return null;
            }

            return DocumentFile.fromTreeUri(context, uri);
        } catch (Exception e) {
            android.util.Log.e("DocumentTreeAccess", "Error getting root folder: " + e.getMessage());
            return null;
        }
    }

    @PluginMethod
    public void pickFolder(PluginCall call) {
        try {
            // Check if the activity is available
            Activity activity = getActivity();
            if (activity == null) {
                call.reject("No activity available for folder selection");
                return;
            }

            // Check if the intent can be resolved
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
            intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                    Intent.FLAG_GRANT_READ_URI_PERMISSION);

            if (intent.resolveActivity(activity.getPackageManager()) == null) {
                call.reject("No app available to handle folder selection");
                return;
            }

            // Start the activity with timeout handling
            startActivityForResult(call, intent, REQUEST_FOLDER);
            
            // Set a timeout to prevent hanging
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                try {
                    call.reject("Folder selection timeout - no response after 30 seconds");
                } catch (Exception e) {
                    // Call might already be resolved, ignore timeout
                }
            }, 30000); // 30 second timeout

        } catch (Exception e) {
            call.reject("Error starting folder selection: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void onFolderPicked(PluginCall call, ActivityResult result) {
        try {
            if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
                call.reject("Folder selection cancelled");
                return;
            }

            Uri uri = result.getData().getData();
            if (uri == null) {
                call.reject("No folder URI returned");
                return;
            }

            Context context = getContext();
            if (context == null) {
                call.reject("No context available");
                return;
            }

            final int flags = result.getData().getFlags() &
                    (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

            // Try to take persistable URI permission
            try {
                context.getContentResolver().takePersistableUriPermission(uri, flags);
            } catch (Exception e) {
                // Log but don't fail - some URIs might not support persistable permissions
                android.util.Log.w("DocumentTreeAccess", "Could not take persistable URI permission: " + e.getMessage());
            }

            // Store URI in SharedPreferences for later use
            try {
                SharedPreferences prefs = context.getSharedPreferences("docTreeAccess", Context.MODE_PRIVATE);
                prefs.edit().putString("folder_uri", uri.toString()).apply();
            } catch (Exception e) {
                call.reject("Error storing folder URI: " + e.getMessage());
                return;
            }

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Error processing folder selection: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getPersistedUri(PluginCall call) {
        try {
            Context context = getContext();
            if (context == null) {
                call.reject("No context available");
                return;
            }

            SharedPreferences prefs = context.getSharedPreferences("docTreeAccess", Context.MODE_PRIVATE);
            String uri = prefs.getString("folder_uri", null);
            JSObject ret = new JSObject();
            ret.put("uri", uri);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error getting persisted URI: " + e.getMessage());
        }
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        try {
            DocumentFile dir = getRootFolder();
            if (dir == null || !dir.isDirectory()) {
                call.reject("No persisted folder");
                return;
            }

            JSArray files = new JSArray();
            DocumentFile[] fileList = dir.listFiles();
            if (fileList != null) {
                for (DocumentFile file : fileList) {
                    if (file != null && file.isFile()) {
                        JSObject f = new JSObject();
                        f.put("name", file.getName() != null ? file.getName() : "unknown");
                        f.put("uri", file.getUri().toString());
                        f.put("type", file.getType() != null ? file.getType() : "application/octet-stream");
                        f.put("size", file.length());
                        files.put(f);
                    }
                }
            }

            JSObject result = new JSObject();
            result.put("files", files);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error listing files: " + e.getMessage());
        }
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        String name = call.getString("name");
        String data = call.getString("data"); // Expecting base64 or plain text

        if (name == null || data == null) {
            call.reject("Missing name or data");
            return;
        }

        DocumentFile dir = getRootFolder();
        if (dir == null) {
            call.reject("No persisted folder");
            return;
        }

        DocumentFile file = dir.findFile(name);
        if (file != null)
            file.delete(); // overwrite
        file = dir.createFile("application/octet-stream", name);

        try (OutputStream os = getContext().getContentResolver().openOutputStream(file.getUri())) {
            os.write(data.getBytes(StandardCharsets.UTF_8));
            call.resolve();
        } catch (Exception e) {
            call.reject("Write failed", e);
        }
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Missing name");
            return;
        }

        DocumentFile dir = getRootFolder();
        DocumentFile file = dir != null ? dir.findFile(name) : null;

        if (file == null || !file.isFile()) {
            call.reject("File not found");
            return;
        }

        try (InputStream is = getContext().getContentResolver().openInputStream(file.getUri())) {
            byte[] buf = new byte[(int) file.length()];
            is.read(buf);
            String contents = new String(buf, StandardCharsets.UTF_8);
            JSObject result = new JSObject();
            result.put("data", contents);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Read failed", e);
        }
    }

    @PluginMethod
    public void deleteFile(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Missing name");
            return;
        }

        DocumentFile dir = getRootFolder();
        DocumentFile file = dir != null ? dir.findFile(name) : null;

        if (file == null || !file.exists()) {
            call.reject("File not found");
            return;
        }

        if (file.delete()) {
            call.resolve();
        } else {
            call.reject("Delete failed");
        }
    }

}
