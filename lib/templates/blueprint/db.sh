#!/bin/bash
help() {
    cat <<EOF
db.sh [COMMAND]

where [COMMAND] is one of

    {{#if configuration.postgres}}
    postgres                Connect to postgres with psql
    redis                   Connect to redis with redis-cli
    migrate                 Migrate the database
    seed                    Seed the database
    up                      Migrate and seed in one step
    down                    Destroy the database
    refresh                 Recreates the database, empties redis and the file storage
    create-seed             Create a seeding CSV file.
                            Expects to be given one or more table names.
    postgres-permissions   Gives (recursive) 777 file permissions to
                            ../postgres/data and ./database/postgres
    {{/if}}
EOF
}

table_export() {
    TABLE=$1
    echo "Creating a seed file for table '$TABLE'"
    docker-compose exec postgres psql valeroo -c "COPY \"$TABLE\" TO '/data/${TABLE}.csv' WITH (FORMAT csv, DELIMITER ';', HEADER, QUOTE '\"');"
}

case "$1" in
    postgres)
        exec docker-compose exec postgres psql -U valeroo -a valeroo
        ;;
    postgres-permissions)
        chmod -R 777 ../postgres/data
        chmod 777 database/postgres
        ;;
    redis)
        exec docker-compose exec redis redis-cli
        ;;
    migrate)
        exec docker-compose exec api yarn pg:migrate
        ;;
    seed)
        exec docker-compose exec api yarn pg:seed
        ;;
    up)
        exec docker-compose exec api yarn pg:migrateAndSeed
        ;;
    down)
        docker-compose exec postgres psql valeroo -c 'DROP SCHEMA PUBLIC cascade; CREATE SCHEMA public;' && \
        docker-compose exec redis redis-cli flushall
        ;;
    clear-storage)
        rm filedriver-storage/*
        ;;
    refresh)
        $0 down && \
        $0 up && \
        $0 clear-storage
        ;;
    create-seed)
        if [ "" = "$2" ]
        then
            help
        else
            # table_export $2
            while [[ ! -z "$2" ]]
            do
                table_export $2
                shift
            done
        fi
        ;;
    *)
        help
        ;;
esac
