import React from 'react';
import ProjectCard from '../components/ProjectCard';
import { useProjectStats, useStorage } from '../contexts/app_context';
import { Link } from 'react-router-dom';

export default function WelcomePage() {
  const projects = useProjectStats();
  const { persisting, quota, usage } = useStorage();

  return (
    <div className="welcome-page page">
      <h1 className='large-title-header'>smooshr</h1>
      <p>Wrangle those messy datasets</p>
      <p className='feedback'>We need your help to make smooshr better! Try out our <a target="_blank" href="https://docs.google.com/document/d/1ANrFqNZKCYR4LogOKPvYVHZAbp1iiK3gpknPlNZF6Lw/">tutorial</a> and leave your thoughts on our <a target="_blank" href="https://airtable.com/shrMCZrvP7467LNG7">feedback form</a></p>
      {projects && (
        <div>
          <div className="">
            <div className="region-header">
              <h2>your projects</h2>
              <Link to={'/new_project'}>
                <button>New Project</button>
              </Link>
            </div>
            <div className="region-list">
              {projects.map(p => (
                <Link to={`/project/${p.project.id}`}>
                  <ProjectCard project={p.project} stats={p.stats} />
                </Link>
              ))}
            </div>
          </div>

          <div className="">
            <div className="region-header">
              <h2>community projects</h2>
            </div>
            <div className="region-list">
              {[].map(p => (
                <Link to={`/project/${p.id}`}>
                  <ProjectCard project={p} />
                </Link>
              ))}
            </div>
          </div>

          <div className="">
            <div className="region-header">
              <h2>Storage</h2>
            </div>
            <div className="region-list">
              persisting: {persisting}
              used: {usage}(Mb) of {quota}(Mb)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
