const mysql = require('mysql');

const con = mysql.createConnection({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT,
  database : process.env.RDS_DATABASE
});


let resultReturn = "{ 'status':'ok', 'id': [";

exports.handler = (event, context, callback) => {
  
  context.callbackWaitsForEmptyEventLoop = false;
  
  process.env.TZ = "America/Sao_Paulo";

  comprarPassagem(event, callback);
};

function comprarPassagem(event, callback){
  adicionarPassagem(event,callback);
  /*
  atualizarAssentos(event,callback);
  atualizarAssentoslivres(event,callback);
  returnResponse(callback);
  */
}

function adicionarPassagem(event, callback){
  var d = new Date, dformat = [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-')+' '+[d.getHours(),d.getMinutes(),d.getSeconds()].join(':');
  var tabelas = "voo_id, assento, passageiro, cliente_id, data_compra";
  var sqlValues = "VALUES ";
  for (var i = 0; i < event.assentos.length; i++){
    sqlValues += "("+event.voo_id+",'"+event.assentos[i]+"','"+event.passageiro[i]+"',"+event.cliente_id+",'"+dformat+"'),";
  }
  sqlValues = sqlValues.slice(0, -1);
  
  const sql = "INSERT INTO passagem ("+tabelas+") "+sqlValues;
  con.query(sql, (err, res) => {
    if (err) {
      throw err;
    }
    for (var i = 0; i < res.affectedRows; i++) {
      resultReturn += (res.insertId-i) + "," ;
    }
    resultReturn = resultReturn.slice(0,-1);
    resultReturn += "]}";
    atualizarAssentos(event,callback);
  });
}

function atualizarAssentos(event,callback){
  var sqlUpdate = "UPDATE ";
  var sqlUpdateOn = "ON ";
  var sqlUpdateSet = "SET ";
  
  for (var i = 0; i < event.assentos.length; i++){
    sqlUpdate += "assento "+event.assentos[i]+" join ";
    sqlUpdateOn += event.assentos[i]+".colunaFileira = '"+event.assentos[i]+"' and "+event.assentos[i]+".voo_id = "+event.voo_id+" and ";
    sqlUpdateSet += event.assentos[i]+".passageiro='"+event.passageiro[i]+"', "+event.assentos[i]+".cliente_id="+event.cliente_id+", ";
  }
  sqlUpdate = sqlUpdate.slice(0, -5);
  sqlUpdateOn = sqlUpdateOn.slice(0, -4);
  sqlUpdateSet = sqlUpdateSet.slice(0, -2);
  
  var sqlUpdateQuery = sqlUpdate + sqlUpdateOn + sqlUpdateSet;

  con.query(sqlUpdateQuery, (err, res) => {
    if (err) {
      throw err;
    }
    atualizarAssentoslivres(event,callback);
  });
}

function atualizarAssentoslivres(event,callback){
  
  //RDS não está permitindo Trigger de MySQL e 
  //nem mesmo INSERT e UPDATE na mesma query, 
  //por isso a update dos assentos será feita em outra query
  
  var sqlUpdate = "UPDATE voo set assentos_livres = ((SELECT abs(quantidadeAssento) where id = "+event.voo_id+") - (SELECT COUNT(id) from passagem where voo_id = "+event.voo_id+")) where id = "+event.voo_id;
  con.query(sqlUpdate, (err, res) => {
    if (err) {
      throw err;
    }
    returnResponse(callback);
  });
}

function returnResponse(callback){
  callback(null, resultReturn);
}
