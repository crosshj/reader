package local.documenttreeaccess.plugin;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;

import com.getcapacitor.*;

@CapacitorPlugin(name = "DocumentTreeAccess")
public class DocumentTreeAccessPlugin extends Plugin {

    private static final int REQUEST_FOLDER = 4001;
    private PluginCall pendingCall;

    private DocumentFile getRootFolder() {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("docTreeAccess", Context.MODE_PRIVATE);
        String uriStr = prefs.getString("folder_uri", null);
        if (uriStr == null)
            return null;
        Uri uri = Uri.parse(uriStr);
        return DocumentFile.fromTreeUri(context, uri);
    }

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                Intent.FLAG_GRANT_READ_URI_PERMISSION);
        pendingCall = call;
        startActivityForResult(call, intent, REQUEST_FOLDER);
    }

    @ActivityCallback
    private void onFolderPicked(PluginCall call, ActivityResult result) {
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
        final int flags = result.getData().getFlags() &
                (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

        context.getContentResolver().takePersistableUriPermission(uri, flags);

        // Store URI in SharedPreferences for later use
        SharedPreferences prefs = context.getSharedPreferences("docTreeAccess", Context.MODE_PRIVATE);
        prefs.edit().putString("folder_uri", uri.toString()).apply();

        JSObject ret = new JSObject();
        ret.put("uri", uri.toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void getPersistedUri(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("docTreeAccess", Context.MODE_PRIVATE);
        String uri = prefs.getString("folder_uri", null);
        JSObject ret = new JSObject();
        ret.put("uri", uri);
        call.resolve(ret);
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        DocumentFile dir = getRootFolder();
        if (dir == null || !dir.isDirectory()) {
            call.reject("No persisted folder");
            return;
        }

        JSArray files = new JSArray();
        for (DocumentFile file : dir.listFiles()) {
            if (file.isFile()) {
                JSObject f = new JSObject();
                f.put("name", file.getName());
                f.put("uri", file.getUri().toString());
                f.put("type", file.getType());
                f.put("size", file.length());
                files.put(f);
            }
        }

        JSObject result = new JSObject();
        result.put("files", files);
        call.resolve(result);
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
