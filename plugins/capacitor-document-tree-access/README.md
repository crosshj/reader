# capacitor-document-tree-access

Capacitor plugin for accessing and persisting user-selected folders using Document Tree Access API (Web) and ACTION_OPEN_DOCUMENT_TREE (Android).

## Install

```bash
npm install capacitor-document-tree-access
npx cap sync
```

## API

<docgen-index>

* [`pickFolder()`](#pickfolder)
* [`getPersistedUri()`](#getpersisteduri)
* [`listFiles()`](#listfiles)
* [`writeFile(...)`](#writefile)
* [`readFile(...)`](#readfile)
* [`deleteFile(...)`](#deletefile)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### pickFolder()

```typescript
pickFolder() => Promise<{ uri: string; }>
```

**Returns:** <code>Promise&lt;{ uri: string; }&gt;</code>

--------------------


### getPersistedUri()

```typescript
getPersistedUri() => Promise<{ uri: string | null; }>
```

**Returns:** <code>Promise&lt;{ uri: string; }&gt;</code>

--------------------


### listFiles()

```typescript
listFiles() => Promise<{ files: { name: string; uri: string; type?: string; size: number; }[]; }>
```

**Returns:** <code>Promise&lt;{ files: { name: string; uri: string; type?: string; size: number; }[]; }&gt;</code>

--------------------


### writeFile(...)

```typescript
writeFile(options: { name: string; data: ArrayBuffer; }) => Promise<void>
```

| Param         | Type                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| **`options`** | <code>{ name: string; data: <a href="#arraybuffer">ArrayBuffer</a>; }</code> |

--------------------


### readFile(...)

```typescript
readFile(options: { name: string; }) => Promise<{ data: ArrayBuffer; }>
```

| Param         | Type                           |
| ------------- | ------------------------------ |
| **`options`** | <code>{ name: string; }</code> |

**Returns:** <code>Promise&lt;{ data: <a href="#arraybuffer">ArrayBuffer</a>; }&gt;</code>

--------------------


### deleteFile(...)

```typescript
deleteFile(options: { name: string; }) => Promise<void>
```

| Param         | Type                           |
| ------------- | ------------------------------ |
| **`options`** | <code>{ name: string; }</code> |

--------------------


### Interfaces


#### ArrayBuffer

Represents a raw buffer of binary data, which is used to store data for the
different typed arrays. ArrayBuffers cannot be read from or written to directly,
but can be passed to a typed array or DataView Object to interpret the raw
buffer as needed.

| Prop             | Type                | Description                                                                     |
| ---------------- | ------------------- | ------------------------------------------------------------------------------- |
| **`byteLength`** | <code>number</code> | Read-only. The length of the <a href="#arraybuffer">ArrayBuffer</a> (in bytes). |

| Method    | Signature                                                                  | Description                                                     |
| --------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **slice** | (begin: number, end?: number) =&gt; <a href="#arraybuffer">ArrayBuffer</a> | Returns a section of an <a href="#arraybuffer">ArrayBuffer</a>. |

</docgen-api>
