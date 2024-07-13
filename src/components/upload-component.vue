<template>
    <div class="column is-12">
        <b-field class="file is-primary" :class="{ 'has-name': !!file }">
            <b-upload accept=".csv" v-model="file" class="file-label">
                <span class="file-cta">
                    <b-icon pack="fas" class="file-icon" icon="upload"></b-icon>
                    <span class="file-label">Upload</span>
                </span>
                <span class="file-name" v-if="file">
                    {{ file.name }}
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
            <b-select :expanded="true" v-model="sampleDataset" size="is-small">
                <option v-for="option in samplDataOptions" :value="option.id" :key="option.id">
                    {{ option.name }}
                </option>
            </b-select>
        </b-field>
        <b-field label="Seed" :label-position="'on-border'">
            <b-input size="is-small" placeholder="Seed" type="number" min="0">
            </b-input>
        </b-field>
    </div>
</template>

<script>
import { ParserFactory } from '../helpers/parser/parser_factory.js'
import { DataFrame } from 'danfojs/dist/danfojs-base';
const DATASET_SIZE = 10000;
export default {
    name: 'UploadComponent',
    props: {
        msg: String
    },
    data() {
        return {
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
            sampleDataset: null
        }
    },
    watch: {
        // eslint-disable-next-line no-unused-vars
        file: async function (val, oldVal) {
            let result = await this.process_file(val, 'csv')
            this.$emit('dataframe', result)
        }
    },
    methods: {
        clickMe() {
            this.$buefy.notification.open('Clicked!!')
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
            return new DataFrame(processdDataset)
        },
        async handleFileSelect(evt, url) {
            var target = evt?.target || evt?.srcElement;
            let file;
            if (target?.value.length == 0) {
                return;
            }
            if (!url) {
                file = evt.target.files[0];
                await this.process_file(file, file.name.split('.')[1])
            } else {
                fetch(url)
                    .then(response => response.blob())
                    .then(async blob => {
                        file = new File([blob], url);
                        await this.process_file(file, 'csv')
                    })
                    .catch(error => {
                        console.error('Error fetching the file:', error);
                    });
            }

        },
    }
}
</script>

<style></style>