const fs = require('fs');
const express = require('express');
const res = require('express/lib/response');

const app = express();

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'succeess',
    data: { tours },
  });
});

app.get('/api/v1/tours/:id', (req, res) => {
  console.log(req.params);

  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    res.status(404).json({
      status: 'fail',
      message: 'invalid id',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

app.patch('/api/v1/tours/:id', (req, res) => {
  console.log("deneme");
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<updated tour>',
    },
  });
 
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
