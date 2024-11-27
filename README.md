Your wallet seed is: 4df682775a4b96cf4dd76f6c36eccc80a9ff501f1557257f6d50b122a274f4ca

Your wallet address is: c945900a55c5e3ff8259a316af6fd84c5a95037912bc67124dc5aa66888f668f|03000781b20eb32efa16328704c7c8ecf8d10557a82fad93db6d358a17b96c415b02276ec4d863fdf78f65f14535a093eba456ae67b551d2339f

Deployed contract at address: 020037639865773de8069113e043b49f0179ca9865b9acf64cc93686520569683f28

Bulleting board:
Deployed contract at address: 02006093d52e07910b76868f7e8ac1f5bec6cb087494e1365f0be95ab1e61f9f9b1e

Questions:
Deployed contract at address: 02002d2d4963d52532b9c7bcf92d0fc2bd94cc499b324a316222403033765d64739e


To run the proof server
docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'

install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

export COMPACT_HOME="/home/erick/my-binaries/compactc"
export PATH="$COMPACT_HOME:$PATH"


compactc src/bboard.compact src/managed/bboard   //at the file of the contract

npx turbo build //at the level of the specific project

yarn testnet-remote ///at the file of the specifc project cli level

donmt forget to check version of node...nvm install


