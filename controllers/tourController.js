const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.checkID = (req, res, next, val) => {
  console.log(val);
  
  if (val > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'succeess',
    requestedAt: req.requestTime,
    data: { tours },
  });
};

exports.getTour = (req, res) => {
  // console.log(req.params);

  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  // if (!tour) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: 'invalid id',
  //   });
  // }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.lenght - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

exports.updateTour = (req, res) => {
  // if (req.params.id * 1 > tours.lenght) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid ID',
  //   });
  // }
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<updated tour>',
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: null,
    },
  });
};
