const fs = require('fs');
const path = require('path');
const Generator = require('objects-to-csv');
const Parser = require('csvtojson');

const generate = (list, name, filter) => {
  const object = list.filter(item => filter(item));

  new Generator(object).toDisk(path.join(__dirname, `${name}.csv`));
};

try {
  (async () => {
    const rawData = fs.readFileSync(path.join(__dirname, 'Database.json'));
    const citizins = JSON.parse(rawData);

    let healthCitizins = await Parser().fromFile(
      path.join(__dirname, 'Base_Saude.csv'),
    );

    const files = [
      {
        name: 'Educação',
        filter: citizin => citizin.study && !citizin.sick,
      },
      {
        name: 'Saúde',
        filter: citizin => citizin.sick && !citizins.bus,
      },
      {
        name: 'Mobilidade',
        filter: citizin => citizin.bus && !citizin.sick,
      },
      {
        name: 'Educação e Saúde',
        filter: citizin => citizin.study && citizin.sick,
      },
      {
        name: 'Educação e Mobilidade',
        filter: citizin => citizin.study && citizin.bus,
      },
    ];

    files.forEach(file => {
      generate(citizins, file.name, file.filter);
    });
  })();
} catch (error) {
  console.warn(`Unable to generate CSV. \n${error}`);
}
