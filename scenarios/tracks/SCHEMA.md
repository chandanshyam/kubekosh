# KubeKosh Tracks Schema Reference

Tracks are the top-level organizational unit in KubeKosh's curriculum. A **track** groups related [bundles](../SCHEMA.md#2-bundles-schema-scenariosbundles) under a common theme and controls which bundles appear together in the navigation sidebar.

Each file in `scenarios/tracks/` represents a single track. The backend loads all track files at startup and exposes them via `GET /api/tracks`, which includes per-track progress aggregation.

---

## Schema Fields

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | string | ✅ | Unique kebab-case identifier. **Must match the filename** (without `.json`). Convention: prefix with an integer for sort order, e.g. `3-networking`. |
| `name` | string | ✅ | Human-readable display name shown in the track selector (e.g. `Networking`). |
| `icon` | string | ✅ | Emoji or Unicode glyph representing the track (e.g. `🌐`). |
| `tagline` | string | ✅ | One-line description of the track's theme. Displayed in the header when the track is active. |
| `color` | string | ✅ | Hex accent color for the track's UI identity (e.g. `#7c3aed`). Should be unique across tracks. |
| `colorDim` | string | ✅ | Low-opacity RGBA equivalent of `color` used for background highlights (e.g. `rgba(124,58,237,0.12)`). |
| `bundle_ids` | array of strings | ✅ | Ordered list of bundle IDs (matching filenames in `scenarios/bundles/`) included in this track. |

---

## Example Track

```json
{
  "id": "3-networking",
  "name": "Networking",
  "icon": "🌐",
  "tagline": "Service mesh, traffic management, and network policies",
  "color": "#7c3aed",
  "colorDim": "rgba(124,58,237,0.12)",
  "bundle_ids": [
    "5-istio",
    "6-traefik",
    "7-haproxy-ingress"
  ]
}
```

---

## Available Tracks

| File | ID | Name | Bundles |
| :--- | :--- | :--- | :--- |
| `1-core-concepts.json` | `1-core-concepts` | 💡 Core Concepts | Kubernetes Basics, Gateway API |
| `2-certifications.json` | `2-certifications` | 🎓 Certifications | K8s App Dev, K8s Admin, K8s Security |
| `3-networking.json` | `3-networking` | 🌐 Networking | Istio, Traefik, HAProxy Ingress |
| `4-security-policy.json` | `4-security-policy` | 🛡️ Security & Policy | Falco |

---

## Authoring Guidelines

- **Filename convention**: Prefix with a numeric sort key (e.g. `4-security-policy.json`). The sort key controls the display order in the UI.
- **`id` must match filename**: The `id` field value must exactly match the filename without the `.json` extension.
- **Color uniqueness**: Each track should use a distinct `color` to avoid visual ambiguity. Current palette:
  - Core Concepts: `#06b6d4` (cyan)
  - Certifications: `#f43f5e` (rose)
  - Networking: `#7c3aed` (violet)
  - Security & Policy: `#f97316` (orange)
- **`bundle_ids` ordering**: Bundles are displayed in the order listed. Reference only IDs that exist in `scenarios/bundles/`.
- **Hot-reload**: Track files are loaded at backend startup. Use the **Reload Cache** button (↻) in the UI or `POST /api/cache/reload` to pick up changes without restarting the container.

---

## Checklist for New Tracks

- [ ] Filename follows `<N>-<kebab-name>.json` convention
- [ ] `id` matches filename (without `.json`)
- [ ] `color` and `colorDim` are unique across all tracks
- [ ] All entries in `bundle_ids` exist as files in `scenarios/bundles/`
- [ ] Track is not referenced by more than one location (bundles belong to one track)
