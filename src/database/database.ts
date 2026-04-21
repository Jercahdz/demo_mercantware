import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    database = SQLite.openDatabaseSync('mercantware.db');
    console.log('📂 Abriendo base de datos...');
  }
  return database;
};

export const closeDatabase = async (): Promise<void> => {
  if (database) {
    try {
      await database.closeAsync();
      database = null;
      console.log('🔒 Base de datos cerrada');
    } catch (error) {
      console.error('Error cerrando BD:', error);
      database = null;
    }
  }
};

export const reinicializarDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  console.log('🔄 Reinicializando base de datos...');
  
  await closeDatabase();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  database = SQLite.openDatabaseSync('mercantware.db');
  console.log('✅ Base de datos reinicializada');
  
  return database;
};

export const db = getDatabase();