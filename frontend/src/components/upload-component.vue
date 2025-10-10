<template>
    <div class="column is-12 has-background-light">
        <b-field class="file is-success is-fullwidth" :class="{ 'has-name': !!file }">
            <b-upload accept=".csv,.txt,.xlsx" v-model="file" class="file-label">
                <a class="button is-success is-small is-fullwidth">
                    <b-icon pack="fas" class="file-icon" icon="upload"></b-icon>
                    <span class="file-label">{{ this.settings.datasetName || "Upload" }}</span>
                </a>
            </b-upload>
        </b-field>
        <b-field>
            <b-checkbox size="is-small" v-model="header">Header</b-checkbox>
        </b-field>
        <b-field label="Separator" :label-position="'on-border'">
            <b-select :expanded="true" v-model="separator" size="is-small">
                <option v-for="option in separatorOptions" :value="option.id" :key="option.id">
                    {{ option.label }}
                </option>
            </b-select>
        </b-field>
        <b-field label="Decimal" :label-position="'on-border'">
            <b-select :expanded="true" v-model="decimal" size="is-small" :label-position="'on-border'">
                <option v-for="option in decimalOptions" :value="option.id" :key="option.id">
                    {{ option.label }}
                </option>
            </b-select>
        </b-field>
        <b-field>
            <b-select :expanded="true" @input="handleFileSelect" size="is-small" v-model="sampleDataset">
                <option v-for="option in samplDataOptions" :value="option.name" :key="option.id">
                    {{ option.label }}
                </option>
            </b-select>
        </b-field>
    </div>
</template>

<script>
import { ParserFactory } from '../helpers/parser/parser_factory.js'
import { DataFrame } from 'danfojs/dist/danfojs-base';
import { settingStore } from '@/stores/settings'

const DATASET_SIZE = 10000;
export default {

    name: 'UploadComponent',
    props: {
        msg: String
    },
    data() {
        return {
            settings: settingStore(),
            sampleDataset: 'none',
            file: null,
            separator: 2,
            header: true,
            decimal: 1,
            decimalOptions:
                [
                    {
                        id: 1,
                        label: '.',
                    }, {
                        id: 2,
                        label: ',',
                    }]
            ,
            separatorOptions:
                [
                    {
                        id: 1,
                        label: '.',
                    }, {
                        id: 2,
                        label: ',',
                    }
                    , {
                        id: 3,
                        label: 'space',
                    }]
            ,
            samplDataOptions:
                [
                    {
                        id: 0,
                        name: 'none',
                        label: 'Select toy dataset',

                    },
                    {
                        id: 1,
                        name: 'iris',
                        label: 'iris',
                    }, {
                        id: 2,
                        name: 'wine',
                        label: 'wine',

                    }
                    , {
                        id: 3,
                        name: 'diabetes',
                        label: 'diabetes',
                    }, {
                        id: 4,
                        name: 'housing',
                        label: 'California Housing',
                    }, {
                        id: 5,
                        name: 'Titanic',
                        label: 'Titanic',

                    },]
            ,
        }
    },
    watch: {
        file: async function (val) {
            try {
                let dataset = await this.process_file(val, val.name.split('.')[1])
                this.initDataframe(dataset, val.name.split('.')[0])
            } catch (error) {
                this.$buefy.toast.open('Failed to parse the dataset.')
            }

        }
    },

    methods: {
        shuffle(array, seed) {
            var m = array.length, t, i;
            // While there remain elements to shuffle…
            while (m) {

                // Pick a remaining element…
                i = Math.floor(this.random(seed) * m--);

                // And swap it with the current element.
                t = array[m];
                array[m] = array[i];
                array[i] = t;
                ++seed
            }
        },
        random(seed) {
            var x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        },
        async initDataframe(dataset, name) {
            this.settings.resetFeatures();
            this.settings.setDatasetName(name);
            this.settings.setDatasetShape({ count: dataset.$data.length, columns: dataset.columns.length });
            let df = await dataset.sample(dataset.$data.length, { seed: this.settings.getSeed });
            this.settings.setDataframe(df)
            this.$emit('uploaded', true)
        },
        async process_file(file, type) {
            let options = {
                separator: this.separator,
                delimiter: this.decimal,
                header: this.header
            }
            let processdDataset = await ParserFactory.createParser(type, options).parse(file)
            if (processdDataset.length > DATASET_SIZE) {
                this.settings.setDatasizeFlag(true);
                this.shuffle(processdDataset, this.settings.getSeed)
                processdDataset = processdDataset.slice(0, DATASET_SIZE)
            } else {
                this.settings.setDatasizeFlag(false);
            }
            let dataFrame = new DataFrame(processdDataset);
            let idIndex = dataFrame.columns.findIndex(col => col.toLowerCase() === 'id')
            if (idIndex > -1)
                dataFrame.drop({ columns: dataFrame.columns[idIndex], inplace: true })
            this.settings.setRawData(processdDataset);
            this.$emit("uploaded-file", file)
            return dataFrame
        },
        async handleFileSelect(event) {
            console.log(event);
            let name = event.target.value
            if (name == 'none') {
                return
            }
            name += '.csv';
            let current = this;
            let file;
            fetch(name)
                .then(response => response.blob())
                .then(async blob => {
                    file = new File([blob], name);
                    let dataframe = await this.process_file(file, 'csv');
                    current.initDataframe(dataframe, name.split('.')[0])
                })
                .catch(error => {
                    console.error('Error fetching the file:', error);
                });

        },
    }
}
</script>

<style></style>