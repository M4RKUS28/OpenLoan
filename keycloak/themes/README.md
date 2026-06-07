# Keycloak themes

## `openloan` — login theme (Sign in / Sign up)

On-brand restyle of the Keycloak login pages so they match the OpenLoan SPA
(warm ivory card on the deep Victoria-Harbour gradient, Fraunces + Manrope,
vermilion action colour). It extends the stock `keycloak` login theme, so all
PatternFly markup/templates stay intact and only the look changes.

```
openloan/login/
  theme.properties                 # parent=keycloak, appends openloan.css
  messages/messages_en.properties  # brand lockup (#kc-header-wrapper) + copy
  resources/css/openloan.css       # the override stylesheet
```

The theme is mounted into the container at `/opt/keycloak/themes` (see both
compose files) and detected at runtime — no image rebuild required.

### Applying it to the realm

`keycloak/realm-app.json` sets `"loginTheme": "openloan"`, but the realm import
is **idempotent**: if the `app` realm already exists, that field is ignored.
Set it on the live realm once (persists in Postgres):

```bash
KC=hongkonghackathon-keycloak-1   # docker container name
docker exec $KC /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 --realm master \
  --user "$KEYCLOAK_ADMIN" --password "$KEYCLOAK_ADMIN_PASSWORD"
docker exec $KC /opt/keycloak/bin/kcadm.sh update realms/app -s loginTheme=openloan
```

(or Admin console → Realm settings → Themes → Login theme → `openloan`).

### Iterating

Dev uses `start-dev`, which disables theme caching — edit the CSS/templates and
just refresh the login page. (In production `start` caches themes, so restart
the keycloak container after changes.)
