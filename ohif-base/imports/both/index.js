import { Base } from '../../namespace';

// Metadata, StudyMetadata, SeriesMetadata, InstanceMetadata, StudySummary
import { Metadata } from './classes/metadata/Metadata';
import { StudyMetadata } from './classes/metadata/StudyMetadata';
import { SeriesMetadata } from './classes/metadata/SeriesMetadata';
import { InstanceMetadata } from './classes/metadata/InstanceMetadata';
import { StudySummary } from './classes/metadata/StudySummary';
Base.metadata = { Metadata, StudyMetadata, SeriesMetadata, InstanceMetadata, StudySummary };

// ImageSet
import { ImageSet } from './classes/ImageSet';
Base.ImageSet = ImageSet;

// DICOMTagDescriptions
import { DICOMTagDescriptions } from './lib/DICOMTagDescriptions';
Base.DICOMTagDescriptions = DICOMTagDescriptions;

// StudyMetadataSource
import { StudyMetadataSource } from './classes/StudyMetadataSource';
Base.StudyMetadataSource = StudyMetadataSource;

// OHIFError
import { OHIFError } from './classes/OHIFError';
Base.OHIFError = OHIFError;

// PropertyMap
import { PropertyMap } from './classes/PropertyMap';
Base.PropertyMap = PropertyMap;


// AsyncDataSource
import { AsyncDataSource } from './classes/AsyncDataSource';
Base.AsyncDataSource = AsyncDataSource;

// Utils
import utils from './lib/utils';
Base.utils = utils;

// Events
import { EventObject } from './classes/EventObject';
import { EventHandler } from './classes/EventHandler';
import { EventSource } from './classes/EventSource';
Base.events = { EventObject, EventHandler, EventSource };
