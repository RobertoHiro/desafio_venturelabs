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
  
  cadastrarCliente(event, callback);
};

function cadastrarCliente(event, callback){
  var tabelas = "nome";
  var sqlValues = "VALUES ";
  for (var i = 0; i < event.nome.length; i++){
    sqlValues += "('"+event.nome[i]+"'),";
  }
  sqlValues = sqlValues.slice(0, -1);
  const sql = "INSERT INTO cliente ("+tabelas+") "+sqlValues;
  
  con.query(sql, (err, res) => {
    if (err) {
      throw err;
    }
    var resultReturn = "{ 'status':'ok', 'id': [";
    for (var i = 0; i < res.affectedRows; i++) {
      resultReturn += (res.insertId-i) + "," ;
    }
    resultReturn = resultReturn.slice(0,-1);
    resultReturn += "]}";
    callback(null, resultReturn);
  });
}