<template>
    <div class="column is-12">
        <b-field class="file is-warning" :class="{ 'has-name': !!file }">
            <b-upload accept=".csv,.txt,.xlsx" v-model="file" class="file-label">
                <span class="file-cta">
                    <b-icon pack="fas" class="file-icon" icon="upload"></b-icon>
                    <span class="file-label">{{ this.settings.datasetName || "Upload" }}</span>
                </span>
            </b-upload>
        </b-field>
        <b-field>
            <b-checkbox v-model="header">Header</b-checkbox>
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
        <b-field label="Sample data" :label-position="'on-border'">
            <b-select :expanded="true" @input="handleFileSelect" size="is-small">
                <option v-for="option in samplDataOptions" :value="option.name" :key="option.id">
                    {{ option.name }}
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
    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'UploadComponent',
    props: {
        msg: String
    },
    data() {
        return {
            sampleDataset: 0,
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

                    },
                    {
                        id: 1,
                        name: 'iris',

                    }, {
                        id: 2,
                        name: 'wine',
                    }
                    , {
                        id: 3,
                        name: 'diabetes',
                    }]
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
        initDataframe(dataset, name) {
            this.settings.resetFeatures();
            this.settings.setDatasetName(name);
            this.settings.setDatasetShape({ count: dataset.$data.length, columns: dataset.columns.length });
            this.settings.setDataframe(dataset)
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
                processdDataset = processdDataset.slice(0, DATASET_SIZE)
            }
            let dataFrame = new DataFrame(processdDataset)
            return dataFrame
        },
        async handleFileSelect(name) {
            name += '.csv';
            let current = this;
            let file;
            fetch('/' + name)
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