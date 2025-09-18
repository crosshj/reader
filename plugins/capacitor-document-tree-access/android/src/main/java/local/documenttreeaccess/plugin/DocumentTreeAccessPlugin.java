package local.documenttreeaccess.plugin;

import com.getcapacitor.Logger;

public class DocumentTreeAccessPlugin {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
