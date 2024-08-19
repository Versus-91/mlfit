<template>
    <section v-if="this.settings.results?.length > 0">
        <b-tabs v-model="settings.resultActiveTab">
            <b-tab-item v-for="result in this.settings.results" :label="result.name.toString()" :key="result.id">
                <div class="columns is-multiline">
                    <classification-view-component :result="result"
                        v-if="result.modelTask"></classification-view-component>
                    <regression-view-component :result="result" v-else>
                    </regression-view-component>
                    <div class="column is-12">
                        <div class="table-container">
                            <table :id="'predictions_table_' + result.id"
                                class="table is-bordered is-hoverable is-narrow display is-size-7" width="100%">
                            </table>
                        </div>
                    </div>
                </div>
            </b-tab-item>
        </b-tabs>
    </section>
    <section v-else>
        <b-message type="is-danger" has-icon icon-pack="fas">
            No result to show.
        </b-message>
    </section>
</template>

<script>
import { settingStore } from '@/stores/settings'
import ClassificationViewComponent from './classification-view-component.vue'
import RegressionViewComponent from './regression-view-component.vue'


export default {
    components: {
        'classification-view-component': ClassificationViewComponent,
        'regression-view-component': RegressionViewComponent,

    },
    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'ResultsComponent',
    props: {
    },
    data() {
        return {
            activeTab: null,
            visitedTabs: []
        }
    },
    methods: {
        resize(id) {
            let isVisited = this.visitedTabs.findIndex(item => item === id);
            console.log('cccccc', isVisited);
            if (isVisited === -1) {
                this.visitedTabs.push(id);
                window.dispatchEvent(new Event('resize'));
            }
        }
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>