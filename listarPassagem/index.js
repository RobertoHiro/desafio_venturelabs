const mysql = require('mysql');

const con = mysql.createConnection({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT,
  database : process.env.RDS_DATABASE
});

exports.handler = (event, context, callback) => {
  
  context.callbackWaitsForEmptyEventLoop = false;
  
  process.env.TZ = "America/Sao_Paulo";

  switch (event.function) {
    case 'assentosDisponiveis':
      listaVooAssentosLivres(event,callback);
      break;
      
    case 'passagemCliente':
      passagensPorCliente(event, callback);
      break;
      
    case 'passagemVoo':
      passagensPorVoo(event, callback);
      break;
    
    default:
      callback(null, "{'status':400,'error':'function name not match'}")
  }

};

function listaVooAssentosLivres(event, callback){
  const sql = "select * from voo where assentos_livres > 0;";
  con.query(sql, (err, res) => {
    if (err) {
      throw err
    }
    callback(null, res);
  });
}

function passagensPorCliente(event, callback){
  const sql = "select * from passagem where cliente_id = "+event.targetId;
  con.query(sql, (err, res) => {
    if (err) {
      throw err
    }
    callback(null, res);
  });
}

function passagensPorVoo(event, callback){
  const sql = "select * from passagem where voo_id = "+event.targetId;
  con.query(sql, (err, res) => {
    if (err) {
      throw err
    }
    callback(null, res);
  });
}