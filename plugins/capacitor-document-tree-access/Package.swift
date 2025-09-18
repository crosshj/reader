// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorDocumentTreeAccess",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapacitorDocumentTreeAccess",
            targets: ["DocumentTreeAccessPluginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "DocumentTreeAccessPluginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/DocumentTreeAccessPluginPlugin"),
        .testTarget(
            name: "DocumentTreeAccessPluginPluginTests",
            dependencies: ["DocumentTreeAccessPluginPlugin"],
            path: "ios/Tests/DocumentTreeAccessPluginPluginTests")
    ]
)