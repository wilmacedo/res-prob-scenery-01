const path = require('path');
const Generator = require('objects-to-csv');
const Parser = require('csvtojson');

const getCitizens = async () => {
  const terms = { saude: 'health', educacao: 'study', mobilidade: 'mobility' };
  const object = Object.keys(terms);

  const citizens = {};

  for (let i = 0; i < object.length; i++) {
    citizens[terms[object[i]]] = await Parser().fromFile(
      path.join(__dirname, 'db', `${object[i]}.csv`),
    );
  }

  return citizens;
};

const filterBySingleRule = (primaryDb, secondaryDb) => {
  const result = primaryDb.filter(citizen => {
    const filtered = secondaryDb.filter(person => citizen.Nome === person.Nome);

    return filtered.length === 0;
  });

  return result;
};

try {
  (async () => {
    const { health, study, mobility } = await getCitizens();

    const files = [
      {
        name: 'Educação',
        list: filterBySingleRule(study, health),
      },
      {
        name: 'Saúde',
        list: filterBySingleRule(health, mobility),
      },
      {
        name: 'Mobilidade',
        list: filterBySingleRule(mobility, health),
      },
    ];

    files.forEach(file => {
      new Generator(file.list).toDisk(
        path.join(__dirname, 'dist', `${file.name}.csv`),
      );
    });
  })();
} catch (error) {
  console.warn(`Unable to generate CSV. \n${error}`);
}
