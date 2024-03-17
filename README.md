# PICTYOUR 201

## Features

- add, get, update pictures
- add, get users
- buy/order the picture
- like picture (SOON)

## Things to be explained in the course:

1. What is Ledger? More details here: https://internetcomputer.org/docs/current/developer-docs/integrations/ledger/
2. What is Internet Identity? More details here: https://internetcomputer.org/internet-identity
3. What is Principal, Identity, Address? https://internetcomputer.org/internet-identity | https://yumimarketplace.medium.com/whats-the-difference-between-principal-id-and-account-id-3c908afdc1f9
4. Canister-to-canister communication and how multi-canister development is done? https://medium.com/icp-league/explore-backend-multi-canister-development-on-ic-680064b06320

## How to deploy canisters implemented in the course

`dfx start --clean --background`

### Ledger canister

`./deploy-local-ledger.sh` - deploys a local Ledger canister. IC works differently when run locally so there is no default network token available and you have to deploy it yourself. Remember that it's not a token like ERC-20 in Ethereum, it's a native token for ICP, just deployed separately.

### Internet identity canister

`dfx deploy internet_identity` - that is the canister that handles the authentication flow. Once it's deployed, the `js-agent` library will be talking to it to register identities. There is UI that acts as a wallet where you can select existing identities
or create a new one.

### Marketplace canister

`dfx deploy dfinity_js_backend` - deploys the mpicture canister where the business logic is implemented.
Basically, it implements functions like add, view, update, delete, and buy picture + a set of helper functions.

Do not forget to run `dfx generate dfinity_js_backend` anytime you add/remove functions in the canister or when you change the signatures.
Otherwise, these changes won't be reflected in IDL's and won't work when called using the JS agent.

### Marketplace frontend canister

`dfx deploy dfinity_js_frontend` - deployes the frontend app for the `dfinity_js_backend` canister on IC.

### ICP Transfer

Transfer ICP:
`npm run mint-tokens amount address`
where:

- `amount` is the total icp want to be send to the address, example : 5000_0000_0000 is equal to 5000 ICP.
- `address` is the address of the recipient. To get the address from the principal, you can use the helper function from the marketplace canister - `getAddressFromPrincipal(principal: Principal)`, it can be called via the Candid UI.

### ADD Picture Example

Due to the "canister call limit" error occurring when saving images in stableBTreemap, images are added using the following external website as an example:

https://source.unsplash.com/500x500?butterfly

### Buy Image

To purchase an image, you need to prepare ICP balance using the transfer method mentioned above, and then select which user will buy the image.
