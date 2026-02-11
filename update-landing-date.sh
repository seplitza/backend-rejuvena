#!/bin/bash

# Update marathon start date to Feb 16, 2026 08:00 MSK (05:00 UTC)
ssh root@37.252.20.170 'mongosh mongodb://localhost:27017/rejuvena --eval "db.landings.updateOne({slug: \"omolodis-stage-7-2280\"}, {\$set: {\"marathonsSection.basic.startDate\": new Date(\"2026-02-16T05:00:00.000Z\")}})"'

# Verify the update
ssh root@37.252.20.170 'mongosh mongodb://localhost:27017/rejuvena --eval "db.landings.findOne({slug: \"omolodis-stage-7-2280\"}, {slug: 1, title: 1, \"marathonsSection.basic.startDate\": 1})"'
