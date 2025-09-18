import Foundation
import Capacitor

/**
 * DocumentTreeAccessPlugin - iOS Implementation
 * 
 * NOTE: iOS implementation is not yet available.
 * This plugin currently only supports Android and Web platforms.
 * All methods return appropriate error responses indicating unsupported platform.
 */
@objc(DocumentTreeAccessPluginPlugin)
public class DocumentTreeAccessPluginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DocumentTreeAccessPluginPlugin"
    public let jsName = "DocumentTreeAccessPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickFolder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPersistedUri", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listFiles", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteFile", returnType: CAPPluginReturnPromise)
    ]

    @objc func pickFolder(_ call: CAPPluginCall) {
        call.reject("iOS implementation not yet available. This plugin currently only supports Android and Web platforms.")
    }

    @objc func getPersistedUri(_ call: CAPPluginCall) {
        call.reject("iOS implementation not yet available. This plugin currently only supports Android and Web platforms.")
    }

    @objc func listFiles(_ call: CAPPluginCall) {
        call.reject("iOS implementation not yet available. This plugin currently only supports Android and Web platforms.")
    }

    @objc func writeFile(_ call: CAPPluginCall) {
        call.reject("iOS implementation not yet available. This plugin currently only supports Android and Web platforms.")
    }

    @objc func readFile(_ call: CAPPluginCall) {
        call.reject("iOS implementation not yet available. This plugin currently only supports Android and Web platforms.")
    }

    @objc func deleteFile(_ call: CAPPluginCall) {
        call.reject("iOS implementation not yet available. This plugin currently only supports Android and Web platforms.")
    }
}
