#!/bin/bash

GRAY='\033[1;36m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GRAY}*********************************************"
echo -e "*                                           *"
echo -e "*              DATABASE SCRIPT              *"
echo -e "*                                           *"
echo -e "*********************************************${NC}"
echo ""
sleep 1

# rollback if exist
echo -e "${GREEN}*********************************"
echo -e "*          Roll Back          *"
echo -e "*********************************${NC}"
npx knex migrate:rollback --all --debug

echo -e "${GREEN}*********************************"
echo -e "*          Migrating Tables          *"
echo -e "*********************************${NC}"
npx knex migrate:latest --debug

# echo -e "${GREEN}*********************************"
# echo -e "*          Seeding Tables          *"
# echo -e "*********************************${NC}"
# npx knex seed:run --debug