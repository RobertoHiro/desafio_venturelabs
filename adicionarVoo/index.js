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

  adicionarVoo(event, callback);

};

function adicionarVoo(event, callback){
  var tabelas = "saida, chegada, origim, destino, quantidadeAssento, preco";
  
  const quantAssent = event.quantidadeColuna * event.quantidadeFileira;
  
  var dadosDoVoo = "'"+event.saida+"','"+event.chegada+"','"+event.origim+"','"+event.destino+"',"+quantAssent+","+event.preco;
  const sql = "insert into voo ("+tabelas+") values ("+dadosDoVoo+");";
  
  var vooID = 0;
  
  con.query(sql, (err, res) => {
    if (err) {
      throw err
    }
    vooID = res.insertId;
    adicionarAssentos(vooID, event, callback);
  });
}

function adicionarAssentos(vooID, event, callback){
    var sqlValues = "VALUES ";
    //converter letra da coluna do assento em número
    var assentoTable = "voo_id, colunaFileira";
    
    for (var i = 0; i < event.quantidadeColuna; i++){
      var letraColuna = String.fromCharCode(97 + i);
        for (var j = 1; j <= event.quantidadeFileira; j++){
          sqlValues += "("+vooID+",'"+letraColuna+j+"'),";
        }
    }
    sqlValues = sqlValues.slice(0,-1);
    
    
    const sqlAssentos = "insert into assento ("+assentoTable+") "+sqlValues+";";
    
    con.query(sqlAssentos, (err, res) => {
      if (err) {
        throw err
      }
      var resultReturn = "{ 'status':'ok', 'id': "+vooID+" }";
      callback(null, resultReturn, callback);
    });
}