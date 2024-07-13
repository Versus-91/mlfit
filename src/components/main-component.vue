<template>
    <div class="column is-9">
        <section>
            <b-tabs v-model="activeTab">
                <b-tab-item label="Data Anaysis">
                    <section>
                        <b-message title="Default" v-model="isActive" :closable="false">
                            <div class="columns is-multiline">
                                <div class="column is-6">
                                    <h5 class="title is-6 has-text-left">Continious Features :</h5>
                                    <b-table class="is-size-7" :data="continiousFeaturesStats"
                                        :columns="continiousFeaturesColumns" :narrowed="true"></b-table>
                                </div>
                                <div class="column is-6">
                                    <h5 class="title is-6 has-text-left">Categorical Features :</h5>
                                    <b-table class="is-size-7" :data="categoricalFeaturesStats"
                                        :columns="categoricalFeaturesColumns" :narrowed="true"></b-table>
                                </div>
                                <div class="column is-6">
                                    <h5 class="title is-6 has-text-left">Sample Data :</h5>
                                    <b-table class="is-size-7" :data="sampleData" :columns="datasetColumns"
                                        :narrowed="true"></b-table>
                                </div>
                            </div>
                        </b-message>
                    </section>
                    <template #empty>
                        <div class="has-text-centered">No records</div>
                    </template>
                </b-tab-item>

                <b-tab-item label="Dymensionality Reduction">
                    What light is light, if Silvia be not seen? <br>
                    What joy is joy, if Silvia be not by— <br>
                    Unless it be to think that she is by <br>
                    And feed upon the shadow of perfection? <br>
                    Except I be by Silvia in the night, <br>
                    There is no music in the nightingale.
                </b-tab-item>
                <b-tab-item label="Results Analysis">
                    Lorem ipsum dolor sit amet.
                </b-tab-item>
                <b-tab-item label="Details" disabled>
                    Nunc nec velit nec libero vestibulum eleifend.
                    Curabitur pulvinar congue luctus.
                    Nullam hendrerit iaculis augue vitae ornare.
                    Maecenas vehicula pulvinar tellus, id sodales felis lobortis eget.
                </b-tab-item>
            </b-tabs>
        </section>
    </div>
</template>

<script>
import UI from '@/helpers/ui';
import { toJSON } from 'danfojs';
let ui = new UI(null, null)
export default {
    name: 'MainComponent',
    props: {
        msg: String,
        dataframe: Object
    },
    data() {
        return {
            continiousFeaturesStats: [
            ],
            continiousFeaturesColumns: [
            ],
            categoricalFeaturesStats: [
            ],
            categoricalFeaturesColumns: [
            ],
            sampleData: [
            ],
            datasetColumns: [
            ],
            isActive: true,
            activeTab: 0
        }
    },
    watch: {
        dataframe: async function (val) {
            let datasetStats = ui.renderDatasetStats(val);
            console.log(datasetStats);
            this.continiousFeaturesColumns = datasetStats[0];
            this.continiousFeaturesStats = datasetStats[1];
            this.categoricalFeaturesColumns = datasetStats[2];
            this.categoricalFeaturesStats = datasetStats[3];
            this.datasetColumns = val.columns.map(column => {
                return {
                    field: column,
                    label: column

                }
            });
            this.sampleData = toJSON(val.head(5));
            console.log(this.sampleData);
            console.log(this.datasetColumns);

        }
    },
}
</script>

<style></style>