import * as SQLite from 'expo-sqlite'

export default async function connect(){
    const connection = await SQLite.openDatabaseAsync("job_applications")
   //await connection.execAsync(
     //   "DROP TABLE IF EXISTS applicants"
    //)
    await connection.execAsync(
        "CREATE TABLE IF NOT EXISTS applicants (id INTEGER PRIMARY KEY NOT NULL, name VARCHAR NOT NULL, email VARCHAR NOT NULL, phone VARCHAR NOT NULL, profile_picture TEXT NULL)"
    )
    return connection
}