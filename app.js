require('dotenv').config();  // dotenv 패키지 로드

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');  // CORS 패키지 로드
const app = express();
const port = 4000;

app.use(cors());  // 모든 출처에서 요청 허용 (CORS 설정)
app.use(express.json());  // JSON 파싱을 위한 미들웨어

// MySQL 연결 설정
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

connection.connect((err) => {
  if (err) {
    console.error('데이터베이스 연결 실패: ' + err.stack);
    return;
  }
  console.log('MySQL 연결 성공');
});

// 모든 제품을 JSON 형식으로 반환하는 API
app.get('/products', (req, res) => {
  const query = 'SELECT name, price, image_url FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('쿼리 실행 오류: ' + err.stack);
      res.status(500).send('서버 오류');
      return;
    }

    const products = results.map(product => ({
      name: product.name,
      price: product.price,
      image_url: product.image_url
    }));

    res.json(products);  // JSON 형식으로 응답
  });
});

// 특정 종류의 제품을 JSON 형식으로 반환하는 API (예: /products/apple)
app.get('/products/:category', (req, res) => {
  const category = req.params.category;  // URL 파라미터로 받은 카테고리 값
  const query = 'SELECT name, price, image_url FROM products WHERE name LIKE ?';

  // 예: '사과'가 포함된 제품만 조회
  const searchTerm = `%${category}%`;

  connection.query(query, [searchTerm], (err, results) => {
    if (err) {
      console.error('쿼리 실행 오류: ' + err.stack);
      res.status(500).send('서버 오류');
      return;
    }

    if (results.length === 0) {
      return res.status(404).send('제품을 찾을 수 없습니다.');
    }

    const products = results.map(product => ({
      name: product.name,
      price: product.price,
      image_url: product.image_url
    }));

    res.json(products);  // JSON 형식으로 응답
  });
});

// order_id가 같은 제품들을 JSON 형식으로 반환하는 API (예: /products/order/1234)
app.get('/products/order/:order_id', (req, res) => {
  const order_id = req.params.order_id;  // URL 파라미터로 받은 order_id 값
  const query = 'SELECT order_id, name, price, img_url FROM select_product WHERE order_id = ?';

  connection.query(query, [order_id], (err, results) => {
    if (err) {
      console.error('쿼리 실행 오류: ' + err.stack);
      res.status(500).send('서버 오류');
      return;
    }

    if (results.length === 0) {
      return res.status(404).send('해당 주문 ID의 제품을 찾을 수 없습니다.');
    }
    
    const products = results.map(product => ({
      order_id: product.order_id,
      name: product.name,
      price: product.price,
      img_url: product.img_url
    }));

    res.json(products);  // JSON 형식으로 응답
  });
});

// 서버 종료 시 MySQL 연결 종료
process.on('SIGINT', () => {
  connection.end((err) => {
    if (err) {
      console.error('MySQL 연결 종료 실패: ' + err.stack);
    } else {
      console.log('MySQL 연결 종료');
    }
    process.exit();
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중`);
});
