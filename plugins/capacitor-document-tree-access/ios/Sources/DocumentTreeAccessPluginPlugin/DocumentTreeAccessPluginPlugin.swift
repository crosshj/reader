import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(DocumentTreeAccessPluginPlugin)
public class DocumentTreeAccessPluginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DocumentTreeAccessPluginPlugin"
    public let jsName = "DocumentTreeAccessPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = DocumentTreeAccessPlugin()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
}
