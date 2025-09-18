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
writeFile(options: { name: string; data: string; }) => Promise<void>
```

| Param         | Type                                         |
| ------------- | -------------------------------------------- |
| **`options`** | <code>{ name: string; data: string; }</code> |

--------------------


### readFile(...)

```typescript
readFile(options: { name: string; }) => Promise<{ data: string; }>
```

| Param         | Type                           |
| ------------- | ------------------------------ |
| **`options`** | <code>{ name: string; }</code> |

**Returns:** <code>Promise&lt;{ data: string; }&gt;</code>

--------------------


### deleteFile(...)

```typescript
deleteFile(options: { name: string; }) => Promise<void>
```

| Param         | Type                           |
| ------------- | ------------------------------ |
| **`options`** | <code>{ name: string; }</code> |

--------------------

</docgen-api>
